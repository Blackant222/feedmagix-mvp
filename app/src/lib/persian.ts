import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

type Numeric = number | string;

export function toPersianDigits(input: Numeric): string {
  const s = String(input);
  const map: Record<string, string> = {
    '0': '۰',
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹',
  };
  return s.replace(/[0-9]/g, (d) => map[d]);
}

export function formatJalaliDate(iso: string, fmt = 'YYYY/MM/DD'): string {
  try {
    const j = dayjs(iso).calendar('jalali').locale('fa');
    return toPersianDigits(j.format(fmt));
  } catch {
    return toPersianDigits('-');
  }
}
