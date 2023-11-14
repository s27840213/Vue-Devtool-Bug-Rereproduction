// To keep some variable export, import them here.
import axios from '@/apis'
import authToken from '@/apis/auth-token'
import design from '@/apis/design'
import designInfo from '@/apis/design-info'
import list from '@/apis/list'
import userApis from '@/apis/user'
import CategoryBackgroundItem from '@/components/category/CategoryBackgroundItem.vue'
import CategoryGroupTemplateItem from '@/components/category/CategoryGroupTemplateItem.vue'
import CategoryList from '@/components/category/CategoryList.vue'
import CategoryListRows from '@/components/category/CategoryListRows.vue'
import CategoryObjectItem from '@/components/category/CategoryObjectItem.vue'
import CategoryTemplateItem from '@/components/category/CategoryTemplateItem.vue'
import CategoryTextItem from '@/components/category/CategoryTextItem.vue'
import ColorPicker from '@/components/ColorPicker.vue'
import DebugTool from '@/components/componentLog/DebugTool.vue'
import NuPage from '@/components/editor/global/NuPage.vue'
import FooterTabs from '@/components/editor/mobile/FooterTabs.vue'
import HeaderTabs from '@/components/editor/mobile/HeaderTabs.vue'
import MobilePanel from '@/components/editor/mobile/MobilePanel.vue'
import MobileSlider from '@/components/editor/mobile/MobileSlider.vue'
import DimBackground from '@/components/editor/page/DimBackground.vue'
import PageContent from '@/components/editor/page/PageContent.vue'
import PanelFonts from '@/components/editor/panelFunction/PanelFonts.vue'
import PanelTextEffectSetting from '@/components/editor/panelFunction/PanelTextEffectSetting.vue'
import PanelAdjust from '@/components/editor/panelMobile/PanelAdjust.vue'
import PanelColor from '@/components/editor/panelMobile/PanelColor.vue'
import PanelFlip from '@/components/editor/panelMobile/PanelFlip.vue'
import PanelFontFormat from '@/components/editor/panelMobile/PanelFontFormat.vue'
import PanelFontSize from '@/components/editor/panelMobile/PanelFontSize.vue'
import PanelFontSpacing from '@/components/editor/panelMobile/PanelFontSpacing.vue'
import PanelNudge from '@/components/editor/panelMobile/PanelNudge.vue'
import PanelObjectAdjust from '@/components/editor/panelMobile/PanelObjectAdjust.vue'
import PanelOpacity from '@/components/editor/panelMobile/PanelOpacity.vue'
import PanelOrder from '@/components/editor/panelMobile/PanelOrder.vue'
import PanelPhotoShadow from '@/components/editor/panelMobile/PanelPhotoShadow.vue'
import PanelPosition from '@/components/editor/panelMobile/PanelPosition.vue'
import PanelRemoveBg from '@/components/editor/panelMobile/PanelRemoveBg.vue'
import PanelTextEffect from '@/components/editor/panelMobile/PanelTextEffect.vue'
import PanelPhoto from '@/components/editor/panelSidebar/PanelPhoto.vue'
import GalleryPhoto from '@/components/GalleryPhoto.vue'
import Checkbox from '@/components/global/Checkbox.vue'
import CollapseTitle from '@/components/global/CollapseTitle.vue'
import ColorBtn from '@/components/global/ColorBtn.vue'
import ImageCarousel from '@/components/global/ImageCarousel.vue'
import MarkerIcon from '@/components/global/MarkerIcon.vue'
import SlideToggle from '@/components/global/SlideToggle.vue'
import Tags from '@/components/global/Tags.vue'
import ImageGallery from '@/components/image-gallery/ImageGallery.vue'
import FontSizeSelector from '@/components/input/FontSizeSelector.vue'
import LazyLoad from '@/components/LazyLoad.vue'
import LinkOrText from '@/components/LinkOrText.vue'
import ModalCard from '@/components/modal/ModalCard.vue'
import ResInfo from '@/components/modal/ResInfo.vue'
import ObserverSentinel from '@/components/ObserverSentinel.vue'
import ProItem from '@/components/payment/ProItem.vue'
import Popup from '@/components/popup/Popup.vue'
import SearchBar from '@/components/SearchBar.vue'
import Tabs from '@/components/Tabs.vue'
import ValueSelector from '@/components/ValueSelector.vue'
import i18n from '@/i18n'
import {
  isIAssetPhoto,
} from '@/interfaces/api'
import {
  ShadowEffectType,
} from '@/interfaces/imgShadow'
import {
  _IPaymentWarningView,
} from '@/interfaces/payment'
import {
  isV1_42,
} from '@/interfaces/vivisticker'
import router from '@/router'
import store from '@/store'
import {
  bgRemoveMoveHandler,
} from '@/store/module/bgRemove'
import listFactory from '@/store/module/listFactory'
import {
  ColorEventType,
  FunctionPanelType,
  LayerType,
  LineTemplatesType,
  MobileColorPanelType,
  PopupSliderEventType,
  SidebarPanelType,
} from '@/store/types'
import apiUtils from '@/utils/apiUtils'
import assetUtils, {
  RESIZE_RATIO_IMAGE,
} from '@/utils/assetUtils'
import backgroundUtils from '@/utils/backgroundUtils'
import bgRemoveUtils from '@/utils/bgRemoveUtils'
import brandkitUtils from '@/utils/brandkitUtils'
import colorUtils, {
  checkAndConvertToHex,
  isValidHexColor,
} from '@/utils/colorUtils'
import constantData from '@/utils/constantData'
import controlUtils from '@/utils/controlUtils'
import designUtils, {
  DESIGN_MENU_EVENTS,
  FOLDER_MENU_EVENTS,
} from '@/utils/designUtils'
import doubleTapUtils from '@/utils/doubleTapUtils'
import dragUtils from '@/utils/dragUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils, {
  PanelEvent,
} from '@/utils/eventUtils'
import fileUtils from '@/utils/fileUtils'
import formatUtils from '@/utils/formatUtils'
import frameUtils from '@/utils/frameUtils'
import galleryUtils from '@/utils/galleryUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import gtmUtils from '@/utils/gtmUtils'
import hintUtils from '@/utils/hintUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageShadowUtils, {
  CANVAS_MAX_SIZE,
  fieldRange,
  shadowPropI18nMap,
} from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import layerFactary from '@/utils/layerFactary'
import layerUtils from '@/utils/layerUtils'
import localeUtils from '@/utils/localeUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import logUtils from '@/utils/logUtils'
import mappingUtils from '@/utils/mappingUtils'
import mathUtils from '@/utils/mathUtils'
import modalUtils from '@/utils/modalUtils'
import mouseUtils from '@/utils/mouseUtils'
import {
  MovingUtils,
} from '@/utils/movingUtils'
import networkUtils from '@/utils/networkUtils'
import overlayUtils from '@/utils/overlayUtils'
import pageUtils from '@/utils/pageUtils'
import paymentUtils from '@/utils/paymentUtils'
import picWVUtils from '@/utils/picWVUtils'
import popupUtils from '@/utils/popupUtils'
import {
  globalQueue,
} from '@/utils/queueUtils'
import resizeUtils from '@/utils/resizeUtils'
import rulerUtils from '@/utils/rulerUtils'
import shapeUtils from '@/utils/shapeUtils'
import shortcutUtils from '@/utils/shortcutUtils'
import snapUtils from '@/utils/snapUtils'
import stepsUtils from '@/utils/stepsUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import svgIconUtils from '@/utils/svgIconUtils'
import swipeDetector from '@/utils/SwipeDetector'
import testUtils from '@/utils/testUtils'
import textFillUtils, {
  replaceImgInject,
} from '@/utils/textFillUtils'
import textPropUtils, {
  fontSelectValue,
} from '@/utils/textPropUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import textUtils from '@/utils/textUtils'
import themeUtils from '@/utils/themeUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import unitUtils, {
  PRECISION,
  STR_UNITS,
} from '@/utils/unitUtils'
import uploadUtils from '@/utils/uploadUtils'
import EmojiTest from '@/views/EmojiTest.vue'
import NativeEventTester from '@/views/NativeEventTester.vue'
import SvgIconView from '@/views/SvgIconView.vue'

!window && console.log(
  axios,
  authToken,
  design,
  designInfo,
  list,
  userApis,
  CategoryBackgroundItem,
  CategoryGroupTemplateItem,
  CategoryList,
  CategoryListRows,
  CategoryObjectItem,
  CategoryTemplateItem,
  CategoryTextItem,
  ColorPicker,
  DebugTool,
  NuPage,
  FooterTabs,
  HeaderTabs,
  MobilePanel,
  MobileSlider,
  DimBackground,
  PageContent,
  PanelFonts,
  PanelTextEffectSetting,
  PanelAdjust,
  PanelColor,
  PanelFlip,
  PanelFontFormat,
  PanelFontSize,
  PanelFontSpacing,
  PanelNudge,
  PanelObjectAdjust,
  PanelOpacity,
  PanelOrder,
  PanelPhotoShadow,
  PanelPosition,
  PanelRemoveBg,
  PanelTextEffect,
  PanelPhoto,
  GalleryPhoto,
  Checkbox,
  CollapseTitle,
  ColorBtn,
  ImageCarousel,
  MarkerIcon,
  SlideToggle,
  Tags,
  ImageGallery,
  FontSizeSelector,
  LazyLoad,
  LinkOrText,
  ModalCard,
  ResInfo,
  ObserverSentinel,
  ProItem,
  Popup,
  SearchBar,
  Tabs,
  ValueSelector,
  i18n,
  isIAssetPhoto,
  ShadowEffectType,
  _IPaymentWarningView,
  isV1_42,
  router,
  store,
  bgRemoveMoveHandler,
  listFactory,
  ColorEventType,
  FunctionPanelType,
  LayerType,
  LineTemplatesType,
  MobileColorPanelType,
  PopupSliderEventType,
  SidebarPanelType,
  apiUtils,
  assetUtils,
  RESIZE_RATIO_IMAGE,
  backgroundUtils,
  bgRemoveUtils,
  brandkitUtils,
  colorUtils,
  checkAndConvertToHex,
  isValidHexColor,
  constantData,
  controlUtils,
  designUtils,
  DESIGN_MENU_EVENTS,
  FOLDER_MENU_EVENTS,
  doubleTapUtils,
  dragUtils,
  editorUtils,
  eventUtils,
  PanelEvent,
  fileUtils,
  formatUtils,
  frameUtils,
  galleryUtils,
  generalUtils,
  groupUtils,
  gtmUtils,
  hintUtils,
  imageAdjustUtil,
  imageShadowPanelUtils,
  imageShadowUtils,
  CANVAS_MAX_SIZE,
  fieldRange,
  shadowPropI18nMap,
  imageUtils,
  layerFactary,
  layerUtils,
  localeUtils,
  localStorageUtils,
  logUtils,
  mappingUtils,
  mathUtils,
  modalUtils,
  mouseUtils,
  MovingUtils,
  networkUtils,
  overlayUtils,
  pageUtils,
  paymentUtils,
  picWVUtils,
  popupUtils,
  globalQueue,
  resizeUtils,
  rulerUtils,
  shapeUtils,
  shortcutUtils,
  snapUtils,
  stepsUtils,
  stkWVUtils,
  svgIconUtils,
  swipeDetector,
  testUtils,
  textFillUtils,
  replaceImgInject,
  textPropUtils,
  fontSelectValue,
  textShapeUtils,
  textUtils,
  themeUtils,
  tiptapUtils,
  unitUtils,
  PRECISION,
  STR_UNITS,
  uploadUtils,
  EmojiTest,
  NativeEventTester,
  SvgIconView,
)
