const baseClasses =
  "rounded bg-[var(--steam-panel)] px-2 py-0.5 text-xs text-[var(--steam-accent)]";

type MultiplayerTagSpanProps = {
  as?: "span";
  label: string;
  active?: never;
  onToggle?: never;
};

type MultiplayerTagButtonProps = {
  as: "button";
  label: string;
  active: boolean;
  onToggle: () => void;
};

type MultiplayerTagProps = MultiplayerTagSpanProps | MultiplayerTagButtonProps;

export function MultiplayerTag(props: MultiplayerTagProps) {
  if (props.as === "button") {
    const { label, active, onToggle } = props;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className={`${baseClasses} border transition-colors ${
          active
            ? "border-[var(--steam-accent)] bg-[var(--steam-accent)]/15"
            : "border-transparent hover:border-[var(--steam-border)]"
        }`}
      >
        {label}
      </button>
    );
  }

  return <span className={baseClasses}>{props.label}</span>;
}
