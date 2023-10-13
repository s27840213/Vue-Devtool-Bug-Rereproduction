import listFactoryPic from '@/store/module/listFactoryPic'
import listFactoryStk from '@/store/module/listFactoryStk'
import generalUtils from '@/utils/generalUtils'

const listFactory = generalUtils.isPic ? listFactoryPic : listFactoryStk

export default listFactory
