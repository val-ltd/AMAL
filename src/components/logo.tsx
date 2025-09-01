import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
        <Image src="/amal-logo.png" alt="Amal Logo" width={80} height={32} />
    </Link>
  );
}
