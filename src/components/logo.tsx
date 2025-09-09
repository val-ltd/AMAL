import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold h-full">
        <Image src="/logo-wadi.png" alt="Amal Logo" width={100} height={40} className="object-contain h-full w-auto" />
    </Link>
  );
}
