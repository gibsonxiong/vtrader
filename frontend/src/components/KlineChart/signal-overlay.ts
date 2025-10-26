import  { registerOverlay , type OverlayTemplate } from 'klinecharts';

registerOverlay({
  name: 'signal',
  totalStep: 2,
  styles: {
    line: { style: 'dashed' },
    text: {
      size: 10,
      borderSize: 10,
      borderColor: '#ff0'
    }
  },
  createPointFigures: ({ overlay, coordinates }) => {    
    const { isBuy, text } = overlay.extendData ?? {
      isBuy: true,
      text: ''
    };

    const startX = coordinates[0]!.x
    const startY = coordinates[0]!.y;
    const lineOffset = 0; // isBuy ? -4 : 4;
    const lineEndY = isBuy ? startY + 30 : startY - 30;
    const arrowEndY = isBuy ? lineEndY + 5 : lineEndY - 5;
    const baseline = isBuy ? 'top' : 'bottom';
    return [
      {
        type: 'line',
        attrs: { coordinates: [{ x: startX + lineOffset, y: startY }, { x: startX, y: lineEndY }] },
        ignoreEvent: true
      },
      {
        type: 'polygon',
        attrs: { coordinates: [{ x: startX + lineOffset, y: lineEndY }, { x: startX + lineOffset - 4, y: arrowEndY }, { x: startX + lineOffset + 4, y: arrowEndY }] },
      },
      {
        type: 'text',
        attrs: { x: startX, y: arrowEndY, text, align: 'center', baseline },
        ignoreEvent: ['onDrawStart', 'onDrawing', 'onDrawEnd', 'onRemoved', 'onPressedMoveStart', 'onPressedMoveEnd', 'onSelected', 'onDeselected']
      }
    ]
  },
  onClick: ({ overlay }) => {
    console.log(overlay);
  }
})
