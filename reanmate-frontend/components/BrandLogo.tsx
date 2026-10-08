import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
  onDark?: boolean;
};

export default function BrandLogo({
  size = 36,
  withWordmark = true,
  wordmarkClassName = "text-white",
  className = "",
  onDark = false,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={
          onDark
            ? "inline-flex shrink-0 rounded-full bg-white/95 p-[2px]"
            : "inline-flex shrink-0"
        }
      >
        <Image
          src="/logo.png"
          alt="ReanMate"
          width={size}
          height={size}
          priority
          className="rounded-full"
          style={{ width: size, height: size }}
        />
      </span>
      {withWordmark ? (
        <span
          className={`hidden text-[1.05rem] font-semibold leading-none tracking-[0.02em] min-[400px]:inline ${wordmarkClassName}`}
        >
          ReanMate
        </span>
      ) : null}
    </span>
  );
}
