import { request, requestBlob } from '@/api/http'
// 产品档案、图片及关联生产批次/二维码数据接口。
export type ProductStatus='enabled'|'disabled';export type ProductCategory='sports_set'|'formal_set'|'outerwear'|'single_item'|'accessory';export type ProductQrCodeType='product'|'batch'|'school';export type ProductSeason='spring'|'summer'|'autumn'|'winter'|'all_season';export type ProductSize='xs'|'s'|'m'|'l'|'xl'|'xxl'|'120'|'130'|'140'|'150'|'160'|'170'
export interface Product {id:number;imageId?:number|null;code?:string;name?:string;category?:ProductCategory;qrCodeType?:ProductQrCodeType;season?:ProductSeason;status?:ProductStatus;createdAt?:string;applicableSchools?:readonly string[];style?:string;color?:string;sizes?:readonly ProductSize[];fabricInfo?:string;executionStandard?:string;washingInstructions?:string;batchCount?:number;totalQuantity?:number}
export interface ProductQrBatch {id:number;batchNo:string;total:number;bound:number;activated:number;voided:number;scans:number}
export type ProductProductionStepStatus='pending'|'in_progress'|'completed'
export interface ProductProductionStep {id:number;nodeName:string;nodeOrder:number;custom:boolean;status?:ProductProductionStepStatus;employeeName?:string;startedAt?:string;completedAt?:string;notes?:string;photoFileId?:number|null}
export interface ProductProductionStepInput {processId:number|null;content:string;operatorName:string;startedAt:string;completedAt:string;status:ProductProductionStepStatus;notes:string;photo:File|null}
export interface ProductQualityReport {id:number;name:string;fileName:string;conclusion?:'qualified'|'unqualified';status?:'pending'|'approved'|'rejected'|'expired';inspectionDate?:string}
export interface ProductProductionBatch {id:number;batchNo:string;quantity?:number;productionDate?:string;status?:string;factoryName?:string;responsibleEmployeeName?:string;qrTotal:number;qrBatches:ProductQrBatch[];productionSteps:ProductProductionStep[]}
export interface ProductDetail {product:Product;batches:ProductProductionBatch[];qualityReports:ProductQualityReport[];access:{production:boolean;qrcode:boolean;quality:boolean}}
export interface ProductInput {name:string;code:string;category:ProductCategory;qrCodeType:ProductQrCodeType;applicableSchools:string[];season:ProductSeason|'';style:string;color:string;sizes:ProductSize[];fabricInfo:string;executionStandard:string;washingInstructions:string;image:File|null}
export interface ProductFilters {keyword:string;category:ProductCategory|'';qrCodeType:ProductQrCodeType|'';status:ProductStatus|''}
export const productCategoryOptions=[{label:'运动套装',value:'sports_set'},{label:'礼服套装',value:'formal_set'},{label:'外套',value:'outerwear'},{label:'校服单品',value:'single_item'},{label:'配饰',value:'accessory'}] satisfies Array<{label:string;value:ProductCategory}>
export const productQrCodeTypeOptions=[{label:'一品一码',value:'product'},{label:'一批一码',value:'batch'},{label:'一校一码',value:'school'}] satisfies Array<{label:string;value:ProductQrCodeType}>
export const productSeasonOptions=[{label:'春季',value:'spring'},{label:'夏季',value:'summer'},{label:'秋季',value:'autumn'},{label:'冬季',value:'winter'},{label:'四季通用',value:'all_season'}] satisfies Array<{label:string;value:ProductSeason}>
export const productSizeOptions=[{label:'XS',value:'xs'},{label:'S',value:'s'},{label:'M',value:'m'},{label:'L',value:'l'},{label:'XL',value:'xl'},{label:'XXL',value:'xxl'},{label:'120',value:'120'},{label:'130',value:'130'},{label:'140',value:'140'},{label:'150',value:'150'},{label:'160',value:'160'},{label:'170',value:'170'}] satisfies Array<{label:string;value:ProductSize}>
const qs=(params:Record<string,string|number>)=>new URLSearchParams(Object.entries(params).filter(([,v])=>v!=='').map(([k,v])=>[k,String(v)])).toString()
export const getProducts=(params:Record<string,string|number>)=>request<{items:Product[];total:number;page:number;pageSize:number}>(`/api/v1/products?${qs(params)}`)
export const getProduct=(id:number)=>request<Product>(`/api/v1/products/${id}`)
export const getProductDetail=(id:number)=>request<ProductDetail>(`/api/v1/products/${id}/detail`)
export const createProductBatchStep=(batchId:number,data:ProductProductionStepInput)=>{const {photo,...payload}=data;const body=new FormData();body.append('payload',JSON.stringify(payload));if(photo)body.append('photo',photo);return request<ProductProductionStep>(`/api/v1/production/batches/${batchId}/steps`,{method:'POST',body})}
export const deleteProductBatchStep=(batchId:number,stepId:number)=>request<null>(`/api/v1/production/batches/${batchId}/steps/${stepId}`,{method:'DELETE'})
// 产品结构化字段序列化到 payload，图片作为 multipart 文件提交。
function body(data:ProductInput){const form=new FormData();const {image,...payload}=data;form.append('payload',JSON.stringify(payload));if(image)form.append('image',image);return form}
export const createProduct=(data:ProductInput)=>request<Product>('/api/v1/products',{method:'POST',body:body(data)})
export const updateProduct=(id:number,data:ProductInput)=>request<Product>(`/api/v1/products/${id}`,{method:'PUT',body:body(data)})
export const updateProductStatus=(id:number,status:ProductStatus)=>request<Product>(`/api/v1/products/${id}/status`,{method:'PATCH',body:JSON.stringify({status})})
export const deleteProduct=(id:number)=>request<null>(`/api/v1/products/${id}`,{method:'DELETE'})
export const getProductImage=(id:number)=>requestBlob(`/api/v1/products/images/${id}`)
