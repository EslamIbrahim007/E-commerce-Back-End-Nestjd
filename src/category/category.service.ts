import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface CategoryTree extends Omit<Category, 'children'> {
  children: CategoryTree[];
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    return await this.categoryRepository.find({
      relations: ['parent', 'children'],
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return await this.categoryRepository.remove(category);
  }

  // Get all root categories (categories without parents)
  async findRootCategories() {
    return await this.categoryRepository.find({
      where: { parentId: undefined },
      relations: ['children'],
    });
  }

  // Get all subcategories for a specific category
  async findSubcategories(parentId: number) {
    return await this.categoryRepository.find({
      where: { parentId },
      relations: ['children'],
    });
  }

  // Get the full category tree
  async findCategoryTree(): Promise<CategoryTree[]> {
    const categories = await this.categoryRepository.find({
      relations: ['parent', 'children'],
    });

    // Filter root categories
    const rootCategories = categories.filter((cat) => !cat.parentId);

    // Build the tree structure
    const buildTree = (category: Category): CategoryTree => {
      const children = categories.filter((cat) => cat.parentId === category.id);
      return {
        ...category,
        children: children.map((child) => buildTree(child)),
      };
    };

    return rootCategories.map((category) => buildTree(category));
  }
}
