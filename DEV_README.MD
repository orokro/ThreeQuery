# To Build

Run: 

`npm run build`

This will publish a MJS/CJS/UMD version of the library in `./dist/`

# To Publish

Increment version in `packing.json`:

```
npm version patch
npm version minor
npm version major
```

Log In:

`npm login`

Publish:

`npm publish -access public`