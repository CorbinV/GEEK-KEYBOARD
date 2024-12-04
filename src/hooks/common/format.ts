export function formatLableSub3(obj: any) {
  if (obj.type !== 'str') return obj;

  const label = obj.label.trim() as string;

  if (label.includes(' ')) {
    const formatted = label
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('');
    return { ...obj, label: formatted };
  }
  const formatted = label.length > 2 ? label.slice(0, 2) : label;
  return { ...obj, label: formatted };
}
