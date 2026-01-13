import { PrismaClient } from '@prisma/client'
import { useEffect, useState } from 'react'

const prisma  = new PrismaClient()

export const getPrisma = () => {
	return prisma
}

