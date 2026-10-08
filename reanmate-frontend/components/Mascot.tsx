import Image from "next/image";

export default function Mascot({
  size = 96,
  className = "",
  onDark = false,
}: {
  size?: number;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Image
      src="/mascot.png"
      alt="មិត្ត AI"
      width={size}
      height={size}
      className={`select-none object-contain ${onDark ? "mascot-on-dark" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
