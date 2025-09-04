"use client";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../app/theme-provider";
import { Facebook, Instagram, Twitter as XIcon, WhatsApp, Copyright } from '@mui/icons-material';

export default function Footer() {
    const { darkMode } = useTheme();

    const footerClasses = darkMode
        ? "bg-black text-white"
        : "bg-white text-gray-800";

    // El color rojo #ED1C24 de tu página de login se usa aquí
    const hoverClass = "hover:text-[#ED1C24]";
    const iconStyle = { fontSize: '2rem' };
    const baseTextStyle = "text-base";

    return (
        <footer className={`${footerClasses} ${baseTextStyle} py-8 mt-8`}>
            {/* Contenedor principal */}
            <div className="container mx-auto px-6 lg:px-16 xl:px-24">
                {/* Grid adaptable de 5 columnas en escritorio */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">

                    {/* Col 1: Logo y Descripción */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-4 cursor-pointer" aria-label="Homepage">
                            <Image
                                src="/logo.png" // Usando tu logo
                                alt="Logo de MiSgro"
                                width={150}
                                height={40}
                                priority
                                className="object-contain h-10 w-auto"
                            />
                        </Link>
                        <p className={`${baseTextStyle} leading-relaxed mb-4 text-gray-400`}>
                            Somos los mejores en cuanto a precios y productos. <br />
                            <strong>Tel:</strong> 0123456789 <br />
                            <strong>Correo:</strong> ventas@misgro.net
                        </p>
                    </div>

                    {/* Col 2: Menú */}
                    <div>
                        <h3 className={`font-bold ${baseTextStyle} mb-2`}>Menú</h3>
                        <ul className={`space-y-1 ${baseTextStyle} text-gray-400`}>
                            <li><Link href="/" className={`transition-colors duration-300 ${hoverClass}`}>Inicio</Link></li>
                            <li><Link href="/products" className={`transition-colors duration-300 ${hoverClass}`}>Tienda</Link></li>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Nuestras tiendas</Link></li>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Crédito directo</Link></li>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Servicios</Link></li>
                        </ul>
                    </div>

                    {/* Col 3: Mi Cuenta */}
                    <div>
                        <h3 className={`font-bold ${baseTextStyle} mb-2`}>Mi Cuenta</h3>
                        <ul className={`space-y-1 ${baseTextStyle} text-gray-400`}>
                            <li><Link href="/cart" className={`transition-colors duration-300 ${hoverClass}`}>Mi Carrito</Link></li>
                            <li><Link href="/miscompras" className={`transition-colors duration-300 ${hoverClass}`}>Tracking de orden</Link></li>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Aniversario de MiSgro</Link></li>
                        </ul>
                    </div>

                    {/* Col 4: Legal */}
                    <div>
                        <h3 className={`font-bold ${baseTextStyle} mb-2`}>Legal</h3>
                        <ul className={`space-y-1 ${baseTextStyle} text-gray-400`}>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Políticas de privacidad</Link></li>
                            <li><Link href="#" className={`transition-colors duration-300 ${hoverClass}`}>Términos y condiciones</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Fila Inferior: Copyright e Iconos Sociales */}
                <div className={`pt-6 flex flex-col md:flex-row justify-between items-center text-sm border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`flex items-center mb-4 md:mb-0 ${baseTextStyle} text-gray-400`}>
                        <Copyright style={{ fontSize: '1rem' }} className="mr-1" />
                        <span>{new Date().getFullYear()} MiSgro Todos los derechos reservados.</span>
                    </div>
                    <div className="flex space-x-4">
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={`transition-colors duration-300 ${hoverClass}`}>
                            <WhatsApp style={iconStyle} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={`transition-colors duration-300 ${hoverClass}`}>
                            <Facebook style={iconStyle} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={`transition-colors duration-300 ${hoverClass}`}>
                            <Instagram style={iconStyle} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)" className={`transition-colors duration-300 ${hoverClass}`}>
                            <XIcon style={iconStyle} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
