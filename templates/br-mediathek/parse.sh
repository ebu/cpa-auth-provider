#!/bin/bash
# parses all mjml files to ejs files in their subdirectory

files="`find | grep \.mjml`"
for f in $files
do
    mjml --output ${f//\.mjml/.ejs} $f
done