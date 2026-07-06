import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { CHANNEL_DEFINITIONS } from "../lib/channels";
import { responseKeyAt } from "../lib/responseKeys";
import type { ChannelMap, StimulusChannel } from "../types";
import { ChannelBadge } from "./ChannelBadge";

type ResponseButtonsProps = {
  answeredChannels?: ChannelMap<boolean>;
  channels: StimulusChannel[];
  disabled: boolean;
  onRespond: (channel: StimulusChannel) => void;
  responseKeys: string[];
};

export function ResponseButtons({ answeredChannels = {}, channels, disabled, onRespond, responseKeys }: ResponseButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="response-grid">
      {channels.map((channel, index) => {
        const definition = CHANNEL_DEFINITIONS[channel];
        const responseKey = responseKeyAt({ responseKeys }, index);
        const answered = Boolean(answeredChannels[channel]);
        const respond = () => onRespond(channel);
        return (
          <button
            aria-pressed={answered}
            className={clsx("response-button", answered && "answered")}
            disabled={disabled}
            key={channel}
            onClick={respond}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse") {
                return;
              }
              event.preventDefault();
              respond();
            }}
            onTouchStart={(event) => {
              if (typeof window !== "undefined" && "PointerEvent" in window) {
                return;
              }
              event.preventDefault();
              respond();
            }}
            title={`${t(definition.labelKey)} (${responseKey})`}
            type="button"
          >
            <ChannelBadge channel={channel} compact />
            <span>{t("train.pressMatch", { channel: t(definition.shortLabelKey) })}</span>
            <kbd>{responseKey}</kbd>
          </button>
        );
      })}
    </div>
  );
}
