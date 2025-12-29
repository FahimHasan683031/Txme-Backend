//single file
export const getSingleFilePath = (files: any, folderName: string) => {
    const fileField = files && files[folderName];
    if (fileField && Array.isArray(fileField) && fileField.length > 0) {
        return fileField[0].path || `/${folderName}/${fileField[0].filename}`;
    }

    return undefined;
};

//multiple files
export const getMultipleFilesPath = (files: any, folderName: string) => {
    const folderFiles = files && files[folderName];
    if (folderFiles) {
        if (Array.isArray(folderFiles)) {
            return folderFiles.map((file: any) => file.path || `/${folderName}/${file.filename}`);
        }
    }

    return undefined;
};