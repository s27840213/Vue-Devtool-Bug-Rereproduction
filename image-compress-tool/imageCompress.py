from PIL import Image
import os


def compress_image(file_path, output_path):
    with Image.open(file_path) as im:
        # Check the file format and set appropriate save options
        if im.format == 'JPEG':
            # For JPEG files, use the quality option to control compression
            im.save(output_path, format='JPEG', quality=95, optimize=True)
        else:
            # For other file formats, use default save options
            im.save(output_path, optimize=True)


def compress_folder(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            file_type = os.path.splitext(file_path)[1].lower()
            output_path = os.path.join(root, file)
            if file_type == '.jpg' or file_type == '.png':
                print(file_path)
                compress_image(file_path, output_path)


if __name__ == '__main__':
    print('conpress start')
    print()
    folder_path = os.path.join(os.path.dirname(os.getcwd()), 'src/assets/img')
    # folder_path = os.path.join(os.path.dirname(os.getcwd()), 'public/lottie')
    # folder_path = os.path.join(os.path.dirname(os.getcwd()), 'src/assets/img')
    # folder_path = os.path.join(os.path.dirname(os.getcwd()), 'src/assets/img')
    # folder_path = os.path.join(os.path.dirname(os.getcwd()), 'src/assets/img')
    compress_folder(folder_path)
