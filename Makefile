preview:
	aws s3 sync --dryrun --exclude ".*" --exclude "config.js" --delete . s3://randompokemon.com

deploy:
	aws s3 sync --exclude ".*" --exclude "config.js" --delete . s3://randompokemon.com
