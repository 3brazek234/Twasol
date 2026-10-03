import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { tokens } from '../theme/tokens';

type IllustrationKind = 'jobs' | 'chat' | 'courts' | 'offer';

interface EmptyStateIllustrationProps {
  kind: IllustrationKind;
  width?: number;
  height?: number;
}

export const EmptyStateIllustration = ({ kind, width = 210, height = 160 }: EmptyStateIllustrationProps) => {
  const { paper, signal, line, muted, docket, white, verdant } = tokens.colors;

  return (
    <Svg width={width} height={height} viewBox="0 0 210 160" accessible={false}>
      <Ellipse cx="105" cy="143" rx="76" ry="8" fill={line} opacity={0.55} />

      {kind === 'jobs' && (
        <>
          <Rect x="39" y="98" width="132" height="9" rx="4" fill={signal} opacity={0.25} />
          <Path d="M51 107v22m108-22v22" stroke={signal} strokeWidth="5" strokeLinecap="round" />
          <Rect x="80" y="54" width="54" height="43" rx="8" fill={signal} />
          <Path d="M93 54v-8a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v8" fill="none" stroke={signal} strokeWidth="5" />
          <Path d="M80 70h54M103 67v8h8v-8" fill="none" stroke={paper} strokeWidth="3" strokeLinejoin="round" />
          <Circle cx="153" cy="43" r="18" fill={docket} opacity={0.18} />
          <Path d="m153 32 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill={docket} />
          <Rect x="53" y="68" width="17" height="23" rx="3" fill={line} />
          <Line x1="57" y1="75" x2="66" y2="75" stroke={muted} strokeWidth="2" />
          <Line x1="57" y1="81" x2="66" y2="81" stroke={muted} strokeWidth="2" />
        </>
      )}

      {kind === 'chat' && (
        <>
          <Rect x="39" y="43" width="84" height="55" rx="15" fill={white} stroke={line} strokeWidth="2" />
          <Path d="m57 98-5 12 18-12" fill={white} stroke={line} strokeWidth="2" strokeLinejoin="round" />
          <Rect x="88" y="66" width="83" height="53" rx="15" fill={signal} />
          <Path d="m149 119 10 12 1-15" fill={signal} />
          <Circle cx="65" cy="70" r="4" fill={docket} />
          <Circle cx="81" cy="70" r="4" fill={docket} />
          <Circle cx="97" cy="70" r="4" fill={docket} />
          <Path d="m111 89 8-8 9 8 8-8 8 8-17 17z" fill={paper} stroke={verdant} strokeWidth="3" strokeLinejoin="round" />
          <Path d="m58 86 13 0m-13 6h21" stroke={line} strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {kind === 'courts' && (
        <>
          <Path d="m54 66 51-31 51 31z" fill={signal} />
          <Rect x="54" y="66" width="102" height="8" rx="2" fill={docket} />
          <Rect x="61" y="75" width="88" height="48" fill={white} stroke={line} strokeWidth="2" />
          {[73, 94, 115, 136].map((x) => (
            <Rect key={x} x={x} y="81" width="8" height="36" rx="3" fill={signal} opacity={0.8} />
          ))}
          <Rect x="51" y="123" width="108" height="8" rx="2" fill={signal} />
          <Rect x="45" y="132" width="120" height="7" rx="3" fill={line} />
          <Circle cx="167" cy="45" r="10" fill={docket} opacity={0.3} />
        </>
      )}

      {kind === 'offer' && (
        <>
          <Circle cx="73" cy="65" r="19" fill={signal} opacity={0.18} />
          <Circle cx="137" cy="65" r="19" fill={docket} opacity={0.2} />
          <Circle cx="73" cy="63" r="10" fill={signal} />
          <Circle cx="137" cy="63" r="10" fill={docket} />
          <Path d="M48 107c2-17 12-27 25-27s23 10 25 27" fill={signal} opacity={0.8} />
          <Path d="M112 107c2-17 12-27 25-27s23 10 25 27" fill={docket} opacity={0.8} />
          <Rect x="81" y="87" width="48" height="31" rx="10" fill={white} stroke={line} strokeWidth="2" />
          <Circle cx="105" cy="102" r="9" fill={verdant} />
          <Path d="M102 102h6m-3-3v6" stroke={white} strokeWidth="2" strokeLinecap="round" />
          <Path d="M103 47c-5-10 7-16 13-8" fill="none" stroke={docket} strokeWidth="3" strokeLinecap="round" />
          <Path d="m114 34 3 5-6 1" fill={docket} />
        </>
      )}
    </Svg>
  );
};
