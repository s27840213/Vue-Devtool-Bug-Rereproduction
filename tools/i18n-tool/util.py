import os


class bcolors: # Colored terminal https://stackoverflow.com/a/287944
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class nocolorsMeta(type):
    def __getattribute__(self, __name):
        return ''

class nocolors(metaclass=nocolorsMeta):
    pass

def find_project_root(path):
    def get_parent(path):
        return os.path.abspath(os.path.join(path, os.pardir))
    while not os.path.exists(os.path.join(path, 'projects')):
        path = get_parent(path)
        if path == '/':
            return path # prevent infinite loop where the parent of '/' is still '/'
    return path