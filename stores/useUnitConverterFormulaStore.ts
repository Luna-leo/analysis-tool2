import { create } from 'zustand';
import { 
  UnitConverterFormula, 
  UnitCategory, 
  AliasConflict,
  DEFAULT_UNIT_CONVERTER_FORMULA 
} from '@/types/unit-converter';
import { PREDEFINED_UNIT_CONVERSIONS } from '@/data/predefinedUnitConversions';

interface UnitConverterFormulaStore {
  // データ
  formulas: UnitConverterFormula[];
  categories: UnitCategory[];
  searchQuery: string;
  selectedCategory: UnitCategory | 'all';
  
  // UI状態
  isDialogOpen: boolean;
  dialogMode: 'create' | 'edit' | 'duplicate';
  selectedFormula: UnitConverterFormula | null;
  
  // アクション
  setFormulas: (formulas: UnitConverterFormula[]) => void;
  addFormula: (formula: Omit<UnitConverterFormula, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFormula: (id: string, updates: Partial<UnitConverterFormula>) => void;
  deleteFormula: (id: string) => void;
  duplicateFormula: (id: string) => void;
  
  // お気に入り
  toggleFavorite: (id: string) => void;
  
  // 使用回数
  incrementUsageCount: (id: string) => void;
  
  // 検索・フィルタリング
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: UnitCategory | 'all') => void;
  getFilteredFormulas: () => UnitConverterFormula[];
  
  // エイリアス管理
  checkAliasConflicts: (formula: UnitConverterFormula, excludeId?: string) => AliasConflict[];
  findFormulaByAlias: (alias: string) => UnitConverterFormula | undefined;
  getAllAliases: () => Map<string, { formulaId: string; formulaName: string; unit: 'from' | 'to' }>;
  
  // ダイアログ管理
  openDialog: (mode: 'create' | 'edit' | 'duplicate', formula?: UnitConverterFormula) => void;
  closeDialog: () => void;
  
  // カテゴリー管理
  getFormulasByCategory: (category: UnitCategory) => UnitConverterFormula[];
  getCategoryCounts: () => Record<UnitCategory | 'all', number>;
}

// Initialize predefined formulas with IDs and timestamps
const initializePredefinedFormulas = (): UnitConverterFormula[] => {
  return PREDEFINED_UNIT_CONVERSIONS.map((formula, index) => ({
    ...formula,
    id: `ucf-predefined-${index}-${formula.name.replace(/\s+/g, '-')}`,
    createdAt: Date.now() - (PREDEFINED_UNIT_CONVERSIONS.length - index) * 1000, // Stagger creation times
    updatedAt: Date.now() - (PREDEFINED_UNIT_CONVERSIONS.length - index) * 1000
  }));
};

export const useUnitConverterFormulaStore = create<UnitConverterFormulaStore>((set, get) => ({
  // 初期データ
  formulas: initializePredefinedFormulas(),
  categories: [
    'temperature', 'pressure', 'length', 'weight', 
    'volume', 'speed', 'area', 'energy', 
    'power', 'time', 'frequency', 'other'
  ],
  searchQuery: '',
  selectedCategory: 'all',
  
  // UI状態
  isDialogOpen: false,
  dialogMode: 'create',
  selectedFormula: null,
  
  // アクション
  setFormulas: (formulas) => set({ formulas }),
  
  addFormula: (formula) => {
    const newFormula: UnitConverterFormula = {
      ...formula,
      id: `ucf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      isFavorite: false
    };
    
    set((state) => ({
      formulas: [...state.formulas, newFormula]
    }));
  },
  
  updateFormula: (id, updates) => {
    set((state) => ({
      formulas: state.formulas.map((formula) =>
        formula.id === id
          ? { ...formula, ...updates, updatedAt: Date.now() }
          : formula
      )
    }));
  },
  
  deleteFormula: (id) => {
    set((state) => ({
      formulas: state.formulas.filter((formula) => formula.id !== id)
    }));
  },
  
  duplicateFormula: (id) => {
    const formula = get().formulas.find((f) => f.id === id);
    if (formula) {
      const duplicated = {
        ...formula,
        name: `${formula.name} (Copy)`,
        id: `ucf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isFavorite: false
      };
      
      set((state) => ({
        formulas: [...state.formulas, duplicated]
      }));
      
      // Open edit dialog for the duplicated formula
      get().openDialog('edit', duplicated);
    }
  },
  
  // お気に入り
  toggleFavorite: (id) => {
    set((state) => ({
      formulas: state.formulas.map((formula) =>
        formula.id === id
          ? { ...formula, isFavorite: !formula.isFavorite }
          : formula
      )
    }));
  },
  
  // 使用回数
  incrementUsageCount: (id) => {
    set((state) => ({
      formulas: state.formulas.map((formula) =>
        formula.id === id
          ? { ...formula, usageCount: (formula.usageCount || 0) + 1 }
          : formula
      )
    }));
  },
  
  // 検索・フィルタリング
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  getFilteredFormulas: () => {
    const { formulas, searchQuery, selectedCategory } = get();
    let filtered = formulas;
    
    // カテゴリーフィルタ
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((formula) => formula.category === selectedCategory);
    }
    
    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((formula) => {
        // 基本フィールドでの検索
        const basicMatch = 
          formula.name.toLowerCase().includes(query) ||
          formula.description.toLowerCase().includes(query) ||
          formula.fromUnit.primarySymbol.toLowerCase().includes(query) ||
          formula.fromUnit.name.toLowerCase().includes(query) ||
          formula.toUnit.primarySymbol.toLowerCase().includes(query) ||
          formula.toUnit.name.toLowerCase().includes(query);
        
        // エイリアスでの検索
        const aliasMatch = 
          formula.fromUnit.aliases.some(alias => alias.toLowerCase().includes(query)) ||
          formula.toUnit.aliases.some(alias => alias.toLowerCase().includes(query));
        
        return basicMatch || aliasMatch;
      });
    }
    
    // お気に入り順 → 使用回数順 → 更新日時順でソート
    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (a.usageCount !== b.usageCount) return (b.usageCount || 0) - (a.usageCount || 0);
      return b.updatedAt - a.updatedAt;
    });
  },
  
  // エイリアス管理
  checkAliasConflicts: (formula, excludeId) => {
    const { formulas } = get();
    const conflicts: AliasConflict[] = [];
    
    // チェック対象のエイリアスを収集
    const checkAliases = [
      ...formula.fromUnit.aliases,
      formula.fromUnit.primarySymbol,
      ...formula.toUnit.aliases,
      formula.toUnit.primarySymbol
    ].map(a => a.toLowerCase());
    
    formulas.forEach((existing) => {
      if (existing.id === excludeId) return;
      
      // 既存の変換式のエイリアスを収集
      const existingAliases = new Map<string, 'from' | 'to'>();
      [existing.fromUnit.primarySymbol, ...existing.fromUnit.aliases].forEach(alias => {
        existingAliases.set(alias.toLowerCase(), 'from');
      });
      [existing.toUnit.primarySymbol, ...existing.toUnit.aliases].forEach(alias => {
        existingAliases.set(alias.toLowerCase(), 'to');
      });
      
      // 競合をチェック
      checkAliases.forEach((alias) => {
        if (existingAliases.has(alias)) {
          conflicts.push({
            alias: alias,
            conflictingFormulaId: existing.id,
            conflictingFormulaName: existing.name,
            unit: existingAliases.get(alias)!
          });
        }
      });
    });
    
    return conflicts;
  },
  
  findFormulaByAlias: (alias) => {
    const { formulas } = get();
    const lowerAlias = alias.toLowerCase();
    
    return formulas.find((formula) => {
      const fromMatches = 
        formula.fromUnit.primarySymbol.toLowerCase() === lowerAlias ||
        formula.fromUnit.aliases.some(a => a.toLowerCase() === lowerAlias);
      
      const toMatches = 
        formula.toUnit.primarySymbol.toLowerCase() === lowerAlias ||
        formula.toUnit.aliases.some(a => a.toLowerCase() === lowerAlias);
      
      return fromMatches || toMatches;
    });
  },
  
  getAllAliases: () => {
    const { formulas } = get();
    const aliasMap = new Map<string, { formulaId: string; formulaName: string; unit: 'from' | 'to' }>();
    
    formulas.forEach((formula) => {
      // From unit
      [formula.fromUnit.primarySymbol, ...formula.fromUnit.aliases].forEach(alias => {
        aliasMap.set(alias.toLowerCase(), {
          formulaId: formula.id,
          formulaName: formula.name,
          unit: 'from'
        });
      });
      
      // To unit
      [formula.toUnit.primarySymbol, ...formula.toUnit.aliases].forEach(alias => {
        aliasMap.set(alias.toLowerCase(), {
          formulaId: formula.id,
          formulaName: formula.name,
          unit: 'to'
        });
      });
    });
    
    return aliasMap;
  },
  
  // ダイアログ管理
  openDialog: (mode, formula) => {
    if (mode === 'create') {
      set({
        isDialogOpen: true,
        dialogMode: mode,
        selectedFormula: {
          ...DEFAULT_UNIT_CONVERTER_FORMULA,
          id: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as UnitConverterFormula
      });
    } else if (formula) {
      set({
        isDialogOpen: true,
        dialogMode: mode,
        selectedFormula: mode === 'duplicate' 
          ? { ...formula, name: `${formula.name} (コピー)` }
          : formula
      });
    }
  },
  
  closeDialog: () => {
    set({
      isDialogOpen: false,
      selectedFormula: null
    });
  },
  
  // カテゴリー管理
  getFormulasByCategory: (category) => {
    const { formulas } = get();
    return formulas.filter((formula) => formula.category === category);
  },
  
  getCategoryCounts: () => {
    const { formulas } = get();
    const counts: Record<UnitCategory | 'all', number> = {
      all: formulas.length,
      temperature: 0,
      pressure: 0,
      length: 0,
      weight: 0,
      volume: 0,
      speed: 0,
      area: 0,
      energy: 0,
      power: 0,
      time: 0,
      frequency: 0,
      other: 0
    };
    
    formulas.forEach((formula) => {
      counts[formula.category]++;
    });
    
    return counts;
  },

  // Get list of categories
  getCategories: () => {
    return ['temperature', 'pressure', 'length', 'weight', 'volume', 'speed', 'area', 'energy', 'power', 'time', 'frequency', 'other'];
  }
}));