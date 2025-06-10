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
        if (!formula.name.trim()) stepErrors.push('Please enter conversion formula name');
        if (!formula.description.trim()) stepErrors.push('Please enter description');
        if (!formula.fromUnit.primarySymbol.trim()) stepErrors.push('Please enter from unit symbol');
        if (!formula.fromUnit.name.trim()) stepErrors.push('Please enter from unit name');
        if (!formula.toUnit.primarySymbol.trim()) stepErrors.push('Please enter to unit symbol');
        if (!formula.toUnit.name.trim()) stepErrors.push('Please enter to unit name');
        break;
      
      case 1: // 変換式
        if (!formula.formula.trim()) {
          stepErrors.push('Please enter conversion formula');
        } else {
          const validation = validateFormula(formula.formula, formula.parameters);
          if (!validation.isValid) {
            stepErrors.push(validation.error || 'Invalid conversion formula');
          }
        }
        
        if (formula.isBidirectional && !formula.reverseFormula?.trim()) {
          stepErrors.push('Please enter reverse conversion formula');
        } else if (formula.isBidirectional && formula.reverseFormula) {
          const reverseValidation = validateFormula(formula.reverseFormula, formula.parameters);
          if (!reverseValidation.isValid) {
            stepErrors.push(`Reverse conversion formula: ${reverseValidation.error}`);
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

  const steps = ['Basic Information', 'Conversion Formula Settings', 'Validation & Preview'];

  return (
    <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === 'create' && 'New Unit Conversion Formula'}
            {dialogMode === 'edit' && 'Edit Unit Conversion Formula'}
            {dialogMode === 'duplicate' && 'Duplicate Unit Conversion Formula'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
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

        {/* Error and warning display */}
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
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Conversion Formula Name *</Label>
                  <Input
                    id="name"
                    value={formula.name}
                    onChange={(e) => setFormula({ ...formula, name: e.target.value })}
                    placeholder="Example: Celsius to Fahrenheit Conversion"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formula.description}
                    onChange={(e) => setFormula({ ...formula, description: e.target.value })}
                    placeholder="Enter the description of this conversion formula"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
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

              {/* From unit */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">From Unit</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromSymbol">Unit Symbol *</Label>
                      <Input
                        id="fromSymbol"
                        value={formula.fromUnit.primarySymbol}
                        onChange={(e) => setFormula({
                          ...formula,
                          fromUnit: { ...formula.fromUnit, primarySymbol: e.target.value }
                        })}
                        placeholder="Example: °C"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromName">Unit Name *</Label>
                      <Input
                        id="fromName"
                        value={formula.fromUnit.name}
                        onChange={(e) => setFormula({
                          ...formula,
                          fromUnit: { ...formula.fromUnit, name: e.target.value }
                        })}
                        placeholder="Example: Celsius"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Aliases</Label>
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
                        placeholder="Add alias"
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

              {/* To unit */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">To Unit</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="toSymbol">Unit Symbol *</Label>
                      <Input
                        id="toSymbol"
                        value={formula.toUnit.primarySymbol}
                        onChange={(e) => setFormula({
                          ...formula,
                          toUnit: { ...formula.toUnit, primarySymbol: e.target.value }
                        })}
                        placeholder="Example: °F"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toName">Unit Name *</Label>
                      <Input
                        id="toName"
                        value={formula.toUnit.name}
                        onChange={(e) => setFormula({
                          ...formula,
                          toUnit: { ...formula.toUnit, name: e.target.value }
                        })}
                        placeholder="Example: Fahrenheit"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Aliases</Label>
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
                        placeholder="Add alias"
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

          {/* Step 2: Conversion Formula Settings */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="bidirectional"
                  checked={formula.isBidirectional}
                  onCheckedChange={(checked) => setFormula({ ...formula, isBidirectional: checked })}
                />
                <Label htmlFor="bidirectional">Enable bidirectional conversion</Label>
              </div>

              <div>
                <Label>Conversion Formula ({formula.fromUnit.primarySymbol} → {formula.toUnit.primarySymbol})</Label>
                <div className="mt-2">
                  <Input
                    value={formula.formula}
                    onChange={(e) => setFormula({ ...formula, formula: e.target.value })}
                    placeholder="Example: x * 9/5 + 32"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Variable 'x' contains the source value. Basic mathematical expressions (+, -, *, /, (), Math functions) can be used.
                  </p>
                </div>
              </div>

              {formula.isBidirectional && (
                <div>
                  <Label>Reverse Conversion Formula ({formula.toUnit.primarySymbol} → {formula.fromUnit.primarySymbol})</Label>
                  <div className="mt-2">
                    <Input
                      value={formula.reverseFormula || ''}
                      onChange={(e) => setFormula({ ...formula, reverseFormula: e.target.value })}
                      placeholder="Example: (x - 32) * 5/9"
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Display Format (Optional)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">From</Label>
                    <Input
                      value={formula.fromUnit.displayFormat || ''}
                      onChange={(e) => setFormula({
                        ...formula,
                        fromUnit: { ...formula.fromUnit, displayFormat: e.target.value }
                      })}
                      placeholder="Example: {value}°C"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Input
                      value={formula.toUnit.displayFormat || ''}
                      onChange={(e) => setFormula({
                        ...formula,
                        toUnit: { ...formula.toUnit, displayFormat: e.target.value }
                      })}
                      placeholder="Example: {value}°F"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Validation & Preview */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Test Conversion Formula</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Test Value</Label>
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
                            Error: {testResult.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Confirm Settings</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium inline">Name: </dt>
                    <dd className="inline">{formula.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Description: </dt>
                    <dd className="inline">{formula.description}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Category: </dt>
                    <dd className="inline">{UNIT_CATEGORIES[formula.category]}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Conversion Direction: </dt>
                    <dd className="inline">
                      {formula.fromUnit.primarySymbol} {formula.isBidirectional ? '⇄' : '→'} {formula.toUnit.primarySymbol}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Conversion Formula: </dt>
                    <dd className="font-mono bg-muted px-2 py-1 rounded mt-1">
                      {formula.toUnit.primarySymbol} = {formula.formula.replace(/x/g, formula.fromUnit.primarySymbol)}
                    </dd>
                  </div>
                  {formula.isBidirectional && formula.reverseFormula && (
                    <div>
                      <dt className="font-medium">Reverse Conversion Formula: </dt>
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
            {currentStep === 0 ? 'Cancel' : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </>
            )}
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave}>
              {dialogMode === 'edit' ? 'Update' : 'Register'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};