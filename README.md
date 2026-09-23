# ELMORA catalogue — the public website

**https://elmoramozambique-del.github.io/Elmora-catalouge-site/**

Everything here is **generated**. Do not edit it by hand — the next build
overwrites it. It is produced from the private `Elmora-catalouge` repository by
`site/v2/build_site.py`, which strips every internal field before writing.

```
/                 home — rooms, collections, a short selection
/r/<room>/        a room
/c/<category>/    a category
/k/<collection>/  a collection
/p/<TAG>/         a product
/photos/t/        the site's own thumbnails, from Drive
```

It holds only what a client may see: titles, collections, categories,
descriptions, care, dimensions, materials, prices and photographs. No supplier
names, no SKUs, no cost notes, no internal notes. The build refuses to write the
site if any of those appear.

`manage-covers-9f4c2be7.html` is the owner's cover-photo picker. It is not
linked from the catalogue and cannot change this site by itself.
