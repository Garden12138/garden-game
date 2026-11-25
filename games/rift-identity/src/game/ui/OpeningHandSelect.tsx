export function OpeningHandSelect({ value, onChange }: {
  value: 0 | 2;
  onChange: (value: 0 | 2) => void;
}) {
  return (
    <label className="rift-opening">身份场起手
      <select value={value} onChange={(event) => onChange(event.target.value === "2" ? 2 : 0)}>
        <option value={0}>空手开局</option>
        <option value={2}>每人两张</option>
      </select>
    </label>
  );
}
