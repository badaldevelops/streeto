import Image from "next/image";

export default function QtooWordmark() {
  return (
    <Image
      src="/qtoo-wordmark.png"
      alt="Qtoo"
      width={246}
      height={100}
      unoptimized
      className="h-auto w-[108px] object-contain sm:w-[132px]"
    />
  );
}
