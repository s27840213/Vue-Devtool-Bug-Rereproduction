export interface IPopupProps {
  event: MouseEvent,
  posX: 'left' | 'right',
  posY: 'top' | 'bottom',
  target: string,
  style: string,
  layerIndex: number
}

export interface IPopupComponent {
  component: string,
  properties: Partial<IPopupProps>,
  closeHandler: () => void,
  props: { [key: string]: string }
}

export interface IPopupOptions {
  icon: string,
  text: string,
  shortcutText: string,
  action: (event?: MouseEvent) => void,
  condition?: boolean
}

export interface ISliderConfig {
  value: number,
  min: number,
  max: number,
  step: number,
  noText: boolean
}
