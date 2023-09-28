// Import some file for build
import Tabs from '@/components/Tabs.vue'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import SearchBar from '@/components/SearchBar.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import CategoryListRow from '@/components/category/CategoryListRow.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import CategoryFontItem from '@/components/category/CategoryFontItem.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import ImageGallery from '@/components/image-gallery/ImageGallery.vue'
import Checkbox from '@/components/global/Checkbox.vue'
import MarkerIcon from '@/components/global/MarkerIcon.vue'
import FontTag from '@/components/global/Tags.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import DimBackground from '@/components/editor/page/DimBackground.vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelTextEffect from '@/components/editor/panelMobile/PanelTextEffect.vue'
import PanelFontSpacing from '@/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelAdjust from '@/components/editor/panelMobile/PanelAdjust.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelFontSize from '@/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontFormat from '@/components/editor/panelMobile/PanelFontFormat.vue'
import PanelOrder from '@/components/editor/panelMobile/PanelOrder.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import PanelNudge from '@/components/editor/panelMobile/PanelNudge.vue'
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelObjectAdjust from '@/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import useCanvasUtils from '@/composable/useCanvasUtils'
import galleryUtils from '@/utils/galleryUtils'
import swipeDetector from '@/utils/SwipeDetector'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import svgIconUtils from '@/utils/svgIconUtils'
import overlayUtils from '@/utils/overlayUtils'
import { DESIGN_MENU_EVENTS, FOLDER_MENU_EVENTS } from '@/utils/designUtils'
import { PopupSliderEventType, LineTemplatesType } from '@/store/types'
import NativeEventTester from '@/views/NativeEventTester.vue'
import SvgIconView from '@/views/SvgIconView.vue'
import DebugTool from '@/components/componentLog/DebugTool.vue'
import ModalCard from '@/components/modal/ModalCard.vue'
import ResInfo from '@/components/modal/ResInfo.vue'
import Popup from '@/components/popup/Popup.vue'
import fileUtils from '@/utils/fileUtils'
import * as payment from '@/interfaces/payment'

!window && console.log('Import',
  Tabs,
  GalleryPhoto,
  SearchBar,
  ObserverSentinel,
  ColorPicker,
  CategoryObjectItem,
  CategoryList,
  CategoryTextItem,
  CategoryListRow,
  CategoryTemplateItem,
  CategoryFontItem,
  CategoryListRows,
  CategoryBackgroundItem,
  CategoryGroupTemplateItem,
  ImageGallery,
  Checkbox,
  MarkerIcon,
  FontTag,
  ColorBtn,
  CollapseTitle,
  SlideToggle,
  DimBackground,
  PageContent,
  PanelColor,
  PanelTextEffect,
  PanelFontSpacing,
  PanelPhotoShadow,
  PanelAdjust,
  PanelRemoveBg,
  PanelFlip,
  PanelFontSize,
  PanelFontFormat,
  PanelOrder,
  PanelOpacity,
  PanelNudge,
  PanelPosition,
  PanelObjectAdjust,
  PanelFonts,
  PanelPhoto,
  useCanvasUtils,
  galleryUtils,
  swipeDetector,
  bgRemoveUtils,
  svgIconUtils,
  overlayUtils,
  DESIGN_MENU_EVENTS,
  FOLDER_MENU_EVENTS,
  PopupSliderEventType,
  LineTemplatesType,
  NativeEventTester,
  SvgIconView,
  DebugTool,
  ModalCard,
  ResInfo,
  Popup,
  fileUtils,
  payment,
)
