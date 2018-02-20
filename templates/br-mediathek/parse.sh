#!/bin/bash
# parses all mjml files to ejs files in their subdirectory

files="`find | grep \.mjml`"
for f in $files
do
    mjml --output ${f//\.mjml/.ejs} $f
done

echo 'WARNING: Some ejs files need manual editing to get closing on template pieces <%- xxx %>!'