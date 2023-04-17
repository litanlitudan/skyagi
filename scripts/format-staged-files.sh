#!/bin/bash

PYTHON_FORMATTER="black"
PYTHON_ISORT="isort"

# regexp for grep to only choose some file extensions for formatting
function IS_PYTHON_FILE {
	[[ $1 == *.py ]]
}

function IS_NODE_FILE {
    [[ $1 == *.ts ]] || [[ $1 == *.tsx ]] || [[ $1 == *.js ]] || [[ $1 == *.jsx ]]
}

declare -A root_to_files # key is root dir, value is a list of files belongs to it

# exludes deleted and renamed files
for file in $(git diff-index --cached --name-only --diff-filter=dr HEAD) ; do
    root=$(cut -d "/" -f1 <<< "$file")
    if [[ -v "root_to_files[$root]" ]] ; then
        root_to_files[$root]+="$file "
    else
        root_to_files[$root]="$file "
    fi
done

for key in "${!root_to_files[@]}" ; do
    PYTHON_FORMATTER_AVAILABLE=0 # 0 is available
    pythonFiles=()
    nodeFiles=()

    # check whether python formatter available
    if ! command -v $PYTHON_FORMATTER &> /dev/null
    then
        echo "Formatter $PYTHON_FORMATTER not found. Formatting on .py won't be done."
        echo "Install formatter $PYTHON_FORMATTER by: pip install $PYTHON_FORMATTER"
        PYTHON_FORMATTER_AVAILABLE=1
    fi


    # check whether python isort available
    if ! command -v $PYTHON_ISORT &> /dev/null
    then
        echo "Formatter $PYTHON_ISORT not found. Formatting on .py won't be done."
        echo "Install formatter $PYTHON_ISORT by: pip install $PYTHON_ISORT"
        PYTHON_FORMATTER_AVAILABLE=1
    fi

    readarray -t project_files <<< "${root_to_files[$key]}"
    for file in ${project_files[@]} ; do
        if IS_PYTHON_FILE $file && [[ $PYTHON_FORMATTER_AVAILABLE ]]
        then
            pythonFiles+=($file)
        elif IS_NODE_FILE $file
        then
            nodeFiles+=($file)
        fi
    done

    # format python code files
    if [[ $PYTHON_FORMATTER_AVAILABLE ]] && [[ ${#pythonFiles[@]} -gt 0 ]]
    then
        echo "Formatting .py files..."
        $PYTHON_ISORT "${pythonFiles[@]}"
        $PYTHON_FORMATTER "${pythonFiles[@]}"
        git add "${pythonFiles[@]}"
    fi

    # format node code files
    if [[ ${#nodeFiles[@]} -gt 0 ]]
    then
        echo "Formatting .js .tx .jsx .tsx .svelte files..."
        make -s format > /dev/null

        git add "${nodeFiles[@]}"
    fi
done
