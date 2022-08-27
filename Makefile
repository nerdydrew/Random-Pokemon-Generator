preview:
	aws s3 sync --dryrun --exclude ".*" --delete public/ s3://randompokemon.com

deploy:
	aws s3 sync --exclude ".*" --delete public/ s3://randompokemon.com

zip:
	zip -r public/sprites/sprites.zip public/sprites -x public/\*.zip