"use client"

import { InstagramLogoIcon, LinkedinLogoIcon, TwitterLogoIcon } from '@phosphor-icons/react'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-black/5 backdrop-blur-md py-1 px-6">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[10px]  uppercase text-white">
          <Link href="#" className="hover:text-blue-500 transition-colors">
            <TwitterLogoIcon size={25} weight="fill" />
          </Link>
          <Link href="#" className="hover:text-pink-500 transition-colors">
            <InstagramLogoIcon size={25} weight="fill" />
          </Link>
          <Link href="#" className="hover:text-sky-500 transition-colors">
            <LinkedinLogoIcon size={25} weight="fill" className='rounded-3xl' />
          </Link>
        </div>
        <div className="flex items-center gap-4 text-[10px]  uppercase text-white/75">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            Privacy and Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer