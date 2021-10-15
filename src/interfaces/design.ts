export interface IFolder {
    name: string,
    isExpanded: boolean,
    isSelected: boolean,
    contains: IFolder[]
}
