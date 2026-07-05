import { MapPin, Music2, Palette, Shapes, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CHANNEL_DEFINITIONS } from "../lib/channels";
import type { StimulusChannel } from "../types";

const icons = {
  position: MapPin,
  "audio-letter": Volume2,
  "audio-tone": Music2,
  "visual-color": Palette,
  "visual-shape": Shapes
} satisfies Record<StimulusChannel, typeof MapPin>;

type ChannelBadgeProps = {
  channel: StimulusChannel;
  compact?: boolean;
};

export function ChannelBadge({ channel, compact = false }: ChannelBadgeProps) {
  const { t } = useTranslation();
  const Icon = icons[channel];
  const definition = CHANNEL_DEFINITIONS[channel];

  return (
    <span className="channel-badge" title={t(definition.labelKey)}>
      <Icon size={compact ? 14 : 16} />
      {t(compact ? definition.shortLabelKey : definition.labelKey)}
    </span>
  );
}
