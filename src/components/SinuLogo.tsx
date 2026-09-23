import Image from "next/image";

export function SinuLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/branding/sinu-logo.png"
      alt="Solomon Islands National University"
      width={151}
      height={58}
      className={`h-9 w-auto ${className}`}
      priority
    />
  );
}
