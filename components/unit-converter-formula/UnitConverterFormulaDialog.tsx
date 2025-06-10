import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useUnitConverterFormulaStore } from '@/stores/useUnitConverterFormulaStore';
import { 
  UnitConverterFormula, 
  UnitDefinition, 
  UNIT_CATEGORIES,
  DEFAULT_UNIT_CONVERTER_FORMULA 
} from '@/types/unit-converter';
import { 
  validateFormula, 
  validateUnitConverterFormula,
  testConversion,
  COMMON_UNIT_SUGGESTIONS 
} from '@/utils/unitConverterUtils';
import { FormulaBuilder } from '@/components/charts/EditModal/parameters/FormulaBuilder';

export const UnitConverterFormulaDialog: React.FC = () => {
  const { 
    isDialogOpen, 
    dialogMode, 
    selectedFormula, 
    closeDialog,
    addFormula,
    updateFormula,
    formulas,
    checkAliasConflicts
  } = useUnitConverterFormulaStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formula, setFormula] = useState<UnitConverterFormula>(
    selectedFormula || { ...DEFAULT_UNIT_CONVERTER_FORMULA } as UnitConverterFormula
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [testValue, setTestValue] = useState(1);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (selectedFormula) {
      setFormula(selectedFormula);
    } else {
      setFormula({ ...DEFAULT_UNIT_CONVERTER_FORMULA } as UnitConverterFormula);
    }
    setCurrentStep(0);
    setErrors([]);
    setWarnings([]);
  }, [selectedFormula, isDialogOpen]);

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length === 0) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 1) {
        // 変換式のテスト実行
        const result = testConversion(formula, testValue);
        setTestResult(result);
      }
    } else {
      setErrors(stepErrors);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors([]);
  };

  const validateStep = (step: number): string[] => {
    const stepErrors: string[] = [];

    switch (step) {
      case 0: // 基本情報
        if (!formula.name.trim()) stepErrors.push('変換式名を入力してください');
        if (!formula.description.trim()) stepErrors.push('説明を入力してください');
        if (!formula.fromUnit.primarySymbol.trim()) stepErrors.push('変換元の単位記号を入力してください');
        if (!formula.fromUnit.name.trim()) stepErrors.push('変換元の単位名を入力してください');
        if (!formula.toUnit.primarySymbol.trim()) stepErrors.push('変換先の単位記号を入力してください');
        if (!formula.toUnit.name.trim()) stepErrors.push('変換先の単位名を入力してください');
        break;
      
      case 1: // 変換式
        if (!formula.formula.trim()) {
          stepErrors.push('変換式を入力してください');
        } else {
          const validation = validateFormula(formula.formula, formula.parameters);
          if (!validation.isValid) {
            stepErrors.push(validation.error || '無効な変換式です');
          }
        }
        
        if (formula.isBidirectional && !formula.reverseFormula?.trim()) {
          stepErrors.push('逆変換式を入力してください');
        } else if (formula.isBidirectional && formula.reverseFormula) {
          const reverseValidation = validateFormula(formula.reverseFormula, formula.parameters);
          if (!reverseValidation.isValid) {
            stepErrors.push(`逆変換式: ${reverseValidation.error}`);
          }
        }
        break;
    }

    return stepErrors;
  };

  const handleSave = () => {
    const validation = validateUnitConverterFormula(
      formula, 
      formulas, 
      dialogMode === 'edit' ? formula.id : undefined
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    if (validation.warnings.length > 0) {
      setWarnings(validation.warnings);
    }

    if (dialogMode === 'edit') {
      updateFormula(formula.id, formula);
    } else {
      addFormula(formula);
    }

    closeDialog();
  };

  const addAlias = (unit: 'from' | 'to', alias: string) => {
    if (!alias.trim()) return;

    const unitKey = unit === 'from' ? 'fromUnit' : 'toUnit';
    const currentUnit = formula[unitKey];
    
    if (!currentUnit.aliases.includes(alias)) {
      setFormula({
        ...formula,
        [unitKey]: {
          ...currentUnit,
          aliases: [...currentUnit.aliases, alias]
        }
      });
    }
  };

  const removeAlias = (unit: 'from' | 'to', index: number) => {
    const unitKey = unit === 'from' ? 'fromUnit' : 'toUnit';
    const currentUnit = formula[unitKey];
    
    setFormula({
      ...formula,
      [unitKey]: {
        ...currentUnit,
        aliases: currentUnit.aliases.filter((_, i) => i !== index)
      }
    });
  };

  const steps = ['基本情報', '変換式設定', '検証・プレビュー'];

  return (
    <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === 'create' && '新規単位変換式'}
            {dialogMode === 'edit' && '単位変換式の編集'}
            {dialogMode === 'duplicate' && '単位変換式の複製'}
          </DialogTitle>
        </DialogHeader>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm
                ${index === currentStep ? 'bg-primary text-primary-foreground' : 
                  index < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
              `}>
                {index + 1}
              </div>
              <div className={`ml-2 text-sm ${index === currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
                {step}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* エラー・警告表示 */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* ステップ1: 基本情報 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">変換式名 *</Label>
                  <Input
                    id="name"
                    value={formula.name}
                    onChange={(e) => setFormula({ ...formula, name: e.target.value })}
                    placeholder="例: 摂氏→華氏変換"
                  />
                </div>

                <div>
                  <Label htmlFor="description">説明 *</Label>
                  <Textarea
                    id="description"
                    value={formula.description}
                    onChange={(e) => setFormula({ ...formula, description: e.target.value })}
                    placeholder="この変換式の説明を入力してください"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">カテゴリー *</Label>
                  <Select
                    value={formula.category}
                    onValueChange={(value) => setFormula({ ...formula, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UNIT_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 変換元単位 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">変換元単位</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromSymbol">単位記号 *</Label>
                      <Input
                        id="fromSymbol"
                        value={formula.fromUnit.primarySymbol}
                        onChange={(e) => setFormula({
                          ...formula,
                          fromUnit: { ...formula.fromUnit, primarySymbol: e.target.value }
                        })}
                        placeholder="例: °C"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromName">単位名 *</Label>
                      <Input
                        id="fromName"
                        value={formula.fromUnit.name}
                        onChange={(e) => setFormula({
                          ...formula,
                          fromUnit: { ...formula.fromUnit, name: e.target.value }
                        })}
                        placeholder="例: Celsius"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>エイリアス</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formula.fromUnit.aliases.map((alias, index) => (
                        <Badge key={index} variant="secondary">
                          {alias}
                          <button
                            onClick={() => removeAlias('from', index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="エイリアスを追加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAlias('from', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input');
                          if (input) {
                            addAlias('from', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 変換先単位 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">変換先単位</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="toSymbol">単位記号 *</Label>
                      <Input
                        id="toSymbol"
                        value={formula.toUnit.primarySymbol}
                        onChange={(e) => setFormula({
                          ...formula,
                          toUnit: { ...formula.toUnit, primarySymbol: e.target.value }
                        })}
                        placeholder="例: °F"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toName">単位名 *</Label>
                      <Input
                        id="toName"
                        value={formula.toUnit.name}
                        onChange={(e) => setFormula({
                          ...formula,
                          toUnit: { ...formula.toUnit, name: e.target.value }
                        })}
                        placeholder="例: Fahrenheit"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>エイリアス</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formula.toUnit.aliases.map((alias, index) => (
                        <Badge key={index} variant="secondary">
                          {alias}
                          <button
                            onClick={() => removeAlias('to', index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="エイリアスを追加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAlias('to', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input');
                          if (input) {
                            addAlias('to', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: 変換式設定 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="bidirectional"
                  checked={formula.isBidirectional}
                  onCheckedChange={(checked) => setFormula({ ...formula, isBidirectional: checked })}
                />
                <Label htmlFor="bidirectional">双方向変換を有効にする</Label>
              </div>

              <div>
                <Label>変換式 ({formula.fromUnit.primarySymbol} → {formula.toUnit.primarySymbol})</Label>
                <div className="mt-2">
                  <Input
                    value={formula.formula}
                    onChange={(e) => setFormula({ ...formula, formula: e.target.value })}
                    placeholder="例: x * 9/5 + 32"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    変数 'x' に変換元の値が入ります。基本的な数式（+, -, *, /, (), Math関数）が使用できます。
                  </p>
                </div>
              </div>

              {formula.isBidirectional && (
                <div>
                  <Label>逆変換式 ({formula.toUnit.primarySymbol} → {formula.fromUnit.primarySymbol})</Label>
                  <div className="mt-2">
                    <Input
                      value={formula.reverseFormula || ''}
                      onChange={(e) => setFormula({ ...formula, reverseFormula: e.target.value })}
                      placeholder="例: (x - 32) * 5/9"
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>表示フォーマット（オプション）</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">変換元</Label>
                    <Input
                      value={formula.fromUnit.displayFormat || ''}
                      onChange={(e) => setFormula({
                        ...formula,
                        fromUnit: { ...formula.fromUnit, displayFormat: e.target.value }
                      })}
                      placeholder="例: {value}°C"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">変換先</Label>
                    <Input
                      value={formula.toUnit.displayFormat || ''}
                      onChange={(e) => setFormula({
                        ...formula,
                        toUnit: { ...formula.toUnit, displayFormat: e.target.value }
                      })}
                      placeholder="例: {value}°F"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ3: 検証・プレビュー */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">変換式のテスト</h3>
                <div className="space-y-4">
                  <div>
                    <Label>テスト値</Label>
                    <Input
                      type="number"
                      value={testValue}
                      onChange={(e) => {
                        setTestValue(Number(e.target.value));
                        const result = testConversion(formula, Number(e.target.value));
                        setTestResult(result);
                      }}
                    />
                  </div>

                  {testResult && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-lg">
                          {testResult.formattedInput} = {testResult.formattedOutput}
                        </div>
                        {testResult.error && (
                          <div className="text-sm text-destructive mt-2">
                            エラー: {testResult.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">設定内容の確認</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium inline">名前: </dt>
                    <dd className="inline">{formula.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">説明: </dt>
                    <dd className="inline">{formula.description}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">カテゴリー: </dt>
                    <dd className="inline">{UNIT_CATEGORIES[formula.category]}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">変換方向: </dt>
                    <dd className="inline">
                      {formula.fromUnit.primarySymbol} {formula.isBidirectional ? '⇄' : '→'} {formula.toUnit.primarySymbol}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">変換式: </dt>
                    <dd className="font-mono bg-muted px-2 py-1 rounded mt-1">
                      {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
                    </dd>
                  </div>
                  {formula.isBidirectional && formula.reverseFormula && (
                    <div>
                      <dt className="font-medium">逆変換式: </dt>
                      <dd className="font-mono bg-muted px-2 py-1 rounded mt-1">
                        {formula.fromUnit.primarySymbol} = {formula.reverseFormula.replace(/x/g, formula.toUnit.primarySymbol)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? closeDialog : handlePrevious}
          >
            {currentStep === 0 ? 'キャンセル' : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                前へ
              </>
            )}
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              次へ
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave}>
              {dialogMode === 'edit' ? '更新' : '登録'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};