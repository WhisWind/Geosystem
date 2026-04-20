# index_calculator.py

class IndexCalculator:
    @staticmethod
    def compute_ndvi(red, nir):
        """Расчёт NDVI"""
        return (nir - red) / (nir + red + 1e-6)

    @staticmethod
    def compute_ndwi(green, nir):
        """Расчёт NDWI"""
        return (green - nir) / (green + nir + 1e-6)

    @staticmethod
    def compute_gndvi(green, nir):
        """Расчёт GNDVI"""
        return (nir - green) / (nir + green + 1e-6)

    @staticmethod
    def compute_nbr(red, nir, swir):
        """Расчёт NBR (нужен SWIR)"""
        return (nir - swir) / (nir + swir + 1e-6)

    @staticmethod
    def compute_evi(blue, red, nir):
        """Расчёт EVI (нужен Blue)"""
        return 2.5 * (nir - red) / ((nir + 6 * red - 7.5 * blue + 1)+ 1e-6)

    @staticmethod
    def compute_gemi(red, nir):
        eta = (2 * (nir**2 - red**2) + 1.5 * nir + 0.5 * red) / (nir + red + 0.5)
        return eta * (1 - 0.25 * eta) - ((red - 0.125) / (1 - red))

    @staticmethod
    def compute_bsi(SWIR1, RED, NIR, BLUE):
        return ((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE) + 1e-10)