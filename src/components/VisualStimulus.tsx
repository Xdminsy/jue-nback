import clsx from "clsx";
import type { StimulusChannel, TrialStimulus } from "../types";

const colorMap: Record<string, string> = {
  teal: "#137a72",
  coral: "#e4572e",
  amber: "#f2c14e",
  violet: "#6c63ff",
  lime: "#8ab17d",
  rose: "#d1495b"
};

type VisualStimulusProps = {
  channels: StimulusChannel[];
  trial: TrialStimulus | null;
  active: boolean;
};

export function VisualStimulus({ channels, trial, active }: VisualStimulusProps) {
  const hasPosition = channels.includes("position");
  const hasColor = channels.includes("visual-color");
  const hasShape = channels.includes("visual-shape");
  const hasAudioOnlyCue = !hasPosition && !hasColor && !hasShape;
  const position = typeof trial?.values.position === "number" ? trial.values.position : null;
  const color = typeof trial?.values["visual-color"] === "string" ? trial.values["visual-color"] : null;
  const shape = typeof trial?.values["visual-shape"] === "string" ? trial.values["visual-shape"] : null;

  return (
    <div className={clsx("stimulus-surface", hasPosition ? "with-position" : "without-position", active && "active")}>
      {hasPosition ? (
        <div className="stimulus-grid" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <div className={clsx("grid-cell", active && position === index && "lit")} key={index}>
              {active && position === index ? <span className="position-dot" /> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="visual-stack" aria-live="polite">
        {active && color ? (
          <span className="color-token" style={{ backgroundColor: colorMap[color] ?? color }} />
        ) : null}
        {active && shape ? <span className={clsx("shape-token", `shape-${shape}`)} /> : null}
        {hasAudioOnlyCue ? <span className={clsx("audio-pulse", active && "active")} aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
