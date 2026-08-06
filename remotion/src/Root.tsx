import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 120+130+160+140+130 = 680 ; transitions 24+22+24+22 = 92 overlap => 588
export const RemotionRoot: React.FC = () => (
  <Composition id="main" component={MainVideo} durationInFrames={588} fps={30} width={1080} height={1920} />
);