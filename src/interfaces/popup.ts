export interface IPopupProps {
  event: MouseEvent,
  posX: string,
  posY: string,
  target: string,
  style: string,
  layerIndex: number
}

export interface IPopupComponent {
  component: string,
  properties: Partial<IPopupProps>,
  closeHandler: () => void
}

export interface IPopupOptions {
  icon: string,
  text: string,
  shortcutText: string,
  action: () => void,
  condition?: boolean
}
