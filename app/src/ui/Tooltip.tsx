interface Props {
  x: number;
  y: number;
  name: string;
  metricLabel: string;
  value: string;
}

export function Tooltip({ x, y, name, metricLabel, value }: Props) {
  return (
    <div className="tooltip" style={{ left: x, top: y }}>
      <div className="tooltip__name">{name}</div>
      <div className="tooltip__metric">
        {metricLabel}: <span className="tooltip__val">{value}</span>
      </div>
    </div>
  );
}
