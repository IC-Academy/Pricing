import type { ButtonHTMLAttributes } from "react";

type Variant="primary"|"secondary"|"ghost"|"danger";
const VARIANT_CLASSES:Record<Variant,string>={
  primary:"bg-brand-600 text-white shadow-[0_8px_18px_rgba(0,42,92,.18)] hover:-translate-y-px hover:bg-brand-700 hover:shadow-[0_12px_24px_rgba(0,42,92,.22)] disabled:bg-ink-300 disabled:shadow-none",
  secondary:"border border-ink-200 bg-white text-brand-800 shadow-sm hover:-translate-y-px hover:border-brand-200 hover:bg-brand-50 disabled:text-ink-400",
  ghost:"bg-transparent text-ink-600 hover:bg-white hover:text-brand-800 hover:shadow-sm disabled:text-ink-300",
  danger:"bg-danger-600 text-white shadow-sm hover:bg-danger-500 disabled:bg-ink-300",
};
interface Props extends ButtonHTMLAttributes<HTMLButtonElement>{variant?:Variant;size?:"sm"|"md";}
export function Button({variant="primary",size="md",className="",...rest}:Props){
  const sizeClass=size==="sm"?"px-3 py-1.5 text-xs":"px-4 py-2.5 text-sm";
  return <button className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`} {...rest}/>;
}
