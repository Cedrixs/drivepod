interface Props {
  size?: number;
}

export function Wordmark({ size = 18 }: Props): React.JSX.Element {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: size, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.025em' }}>Drive</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.025em' }}>pod</span>
    </span>
  );
}
