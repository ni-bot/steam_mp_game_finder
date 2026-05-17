const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-9 w-9",
} as const;

interface SelectableFriendAvatarProps {
  src: string;
  selected: boolean;
  size?: keyof typeof SIZE_CLASSES;
}

export function SelectableFriendAvatar({
  src,
  selected,
  size = "md",
}: SelectableFriendAvatarProps) {
  const dim = SIZE_CLASSES[size];

  return (
    <span
      data-selected={selected ? "true" : "false"}
      className={[
        "inline-flex shrink-0 rounded-full transition-[box-shadow,transform] duration-150 motion-reduce:transition-[box-shadow] motion-reduce:transform-none",
        "data-[selected=true]:scale-105 motion-reduce:data-[selected=true]:scale-100",
        selected
          ? "shadow-[0_0_0_2px_var(--steam-accent)]"
          : "shadow-[0_0_0_2px_transparent]",
      ].join(" ")}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={`${dim} rounded-full object-cover`} />
      ) : (
        <span className={`${dim} rounded-full bg-[var(--steam-panel)]`} />
      )}
    </span>
  );
}
