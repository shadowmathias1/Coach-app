import type { UnitSystem } from '@/components/shared/UnitProvider';

export function kgToLb(kg: number) {
  return kg * 2.20462;
}

export function lbToKg(lb: number) {
  return lb / 2.20462;
}

export function cmToIn(cm: number) {
  return cm / 2.54;
}

export function inToCm(inches: number) {
  return inches * 2.54;
}

export function formatWeight(valueKg: number, unit: UnitSystem) {
  if (unit === 'imperial') {
    return `${Math.round(kgToLb(valueKg))} lb`;
  }
  return `${Math.round(valueKg)} kg`;
}

export function displayWeightValue(valueKg: number, unit: UnitSystem) {
  return unit === 'imperial' ? Math.round(kgToLb(valueKg)) : Math.round(valueKg);
}

export function toMetricWeight(value: number, unit: UnitSystem) {
  return unit === 'imperial' ? lbToKg(value) : value;
}

export function formatHeight(valueCm: number, unit: UnitSystem) {
  if (unit === 'imperial') {
    const totalInches = cmToIn(valueCm);
    let feet = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches - feet * 12);
    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    return `${feet} ft ${inches} in`;
  }
  return `${Math.round(valueCm)} cm`;
}

export function weightInputLabel(unit: UnitSystem) {
  return unit === 'imperial' ? 'lb' : 'kg';
}

export function heightInputLabel(unit: UnitSystem) {
  return unit === 'imperial' ? 'in' : 'cm';
}
