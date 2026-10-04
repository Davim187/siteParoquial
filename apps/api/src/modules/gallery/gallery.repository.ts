import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export const albumInclude = {
  coverMedia: true,
  _count: { select: { photos: true } },
} satisfies Prisma.GalleryAlbumInclude

export const photoInclude = {
  media: true,
} satisfies Prisma.GalleryPhotoInclude

export function countAlbums(where: Prisma.GalleryAlbumWhereInput) {
  return prisma.galleryAlbum.count({ where })
}

export function findAlbums(args: { where: Prisma.GalleryAlbumWhereInput; skip: number; take: number }) {
  return prisma.galleryAlbum.findMany({
    where: args.where,
    include: albumInclude,
    orderBy: [{ eventDate: 'desc' }, { sortOrder: 'asc' }],
    skip: args.skip,
    take: args.take,
  })
}

export function findAlbumBySlug(slug: string) {
  return prisma.galleryAlbum.findUnique({
    where: { slug },
    include: {
      coverMedia: true,
      photos: {
        include: photoInclude,
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

export function findAlbumRecordBySlug(slug: string) {
  return prisma.galleryAlbum.findUnique({ where: { slug } })
}

export function findAlbumById(id: string) {
  return prisma.galleryAlbum.findUnique({ where: { id } })
}

export function findAlbumSlugConflict(slug: string, id: string) {
  return prisma.galleryAlbum.findFirst({ where: { slug, NOT: { id } } })
}

export function createAlbum(data: Prisma.GalleryAlbumUncheckedCreateInput) {
  return prisma.galleryAlbum.create({ data, include: albumInclude })
}

export function updateAlbum(id: string, data: Prisma.GalleryAlbumUncheckedUpdateInput) {
  return prisma.galleryAlbum.update({ where: { id }, data, include: albumInclude })
}

export function updateAlbumCover(id: string, coverMediaId: string) {
  return prisma.galleryAlbum.update({
    where: { id },
    data: { coverMediaId },
  })
}

export function connectAlbumCover(id: string, mediaId: string) {
  return prisma.galleryAlbum.update({
    where: { id },
    data: { coverMedia: { connect: { id: mediaId } } },
  })
}

export function clearOrSetCover(id: string, coverMediaId: string | null) {
  return prisma.galleryAlbum.update({
    where: { id },
    data: { coverMediaId },
  })
}

export function deleteAlbum(id: string) {
  return prisma.galleryAlbum.delete({ where: { id } })
}

export function findMediaById(id: string) {
  return prisma.media.findUnique({ where: { id } })
}

export function maxPhotoSortOrder(albumId: string) {
  return prisma.galleryPhoto.aggregate({
    where: { albumId },
    _max: { sortOrder: true },
  })
}

export function createPhoto(data: Prisma.GalleryPhotoUncheckedCreateInput) {
  return prisma.galleryPhoto.create({ data, include: photoInclude })
}

export function createMedia(data: Prisma.MediaUncheckedCreateInput) {
  return prisma.media.create({ data })
}

export function findPhotosByAlbum(albumId: string) {
  return prisma.galleryPhoto.findMany({ where: { albumId } })
}

export function reorderPhotos(photoIds: string[]) {
  return prisma.$transaction(
    photoIds.map((photoId, index) =>
      prisma.galleryPhoto.update({ where: { id: photoId }, data: { sortOrder: index } }),
    ),
  )
}

export function findPhoto(albumId: string, photoId: string) {
  return prisma.galleryPhoto.findFirst({ where: { id: photoId, albumId } })
}

export function updatePhoto(photoId: string, data: Prisma.GalleryPhotoUpdateInput) {
  return prisma.galleryPhoto.update({ where: { id: photoId }, data, include: photoInclude })
}

export function findPhotoWithRelations(albumId: string, photoId: string) {
  return prisma.galleryPhoto.findFirst({
    where: { id: photoId, albumId },
    include: { media: true, album: true },
  })
}

export function deletePhoto(photoId: string) {
  return prisma.galleryPhoto.delete({ where: { id: photoId } })
}

export function findNextCoverPhoto(albumId: string) {
  return prisma.galleryPhoto.findFirst({
    where: { albumId },
    orderBy: { sortOrder: 'asc' },
    include: { media: true },
  })
}
