preview:
	aws s3 sync --dryrun --exclude ".*" --delete . s3://randompokemon.com

deploy:
	aws s3 sync --exclude ".*" --delete . s3://randompokemon.com

zip:
	zip -r sprites/sprites.zip sprites -x \*.zip