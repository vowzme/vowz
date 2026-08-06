import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { NAVY_DEEP } from "./theme";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Templates } from "./scenes/Scene2Templates";
import { Scene3Features } from "./scenes/Scene3Features";
import { Scene4Card } from "./scenes/Scene4Card";
import { Scene5CTA } from "./scenes/Scene5CTA";

const T = (n: number) => springTiming({ config: { damping: 200 }, durationInFrames: n });

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: NAVY_DEEP }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120}>
        <Scene1Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={T(24)} />
      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene2Templates />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={T(22)} />
      <TransitionSeries.Sequence durationInFrames={160}>
        <Scene3Features />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={T(24)} />
      <TransitionSeries.Sequence durationInFrames={140}>
        <Scene4Card />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={T(22)} />
      <TransitionSeries.Sequence durationInFrames={130}>
        <Scene5CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);