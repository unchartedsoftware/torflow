import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Created by chrisdickson on 15-07-28.
 */
public class TileRequest {
	private static String PROTOCOL = "http";
	private static String BASE_URL = "a.basemaps.cartocdn.com";
	private static String IMAGE_FORMAT = "png";
	private static int TILE_SIZE = 256;		// tiles are 256*256

	private String _url;
	private String _absoluteFilePath;
	private String _absoluteDirectoryPath;


	TileRequest(String basePath, String map, int zoom, int x, int y) {
		_url = PROTOCOL + "://" + BASE_URL + "/" + map + "/" + zoom + "/" + x + "/" + y + "." + IMAGE_FORMAT;
		_absoluteDirectoryPath = (basePath.endsWith("/") ? basePath : basePath + "/") + map + "/" + zoom + "/" + x + "/";
		_absoluteFilePath = _absoluteDirectoryPath + y + "." + IMAGE_FORMAT;
	}

	private void save(byte[] bytes) throws IOException {
		// Create directory
		File f = new File(_absoluteDirectoryPath);
		f.mkdirs();


		FileOutputStream fos = new FileOutputStream(_absoluteFilePath);
		fos.write(bytes);
		fos.close();
	}

	public void fetch() throws IOException {

		// Downlaod the image and save as byte array
		URL url = new URL(_url);
		InputStream in = new BufferedInputStream(url.openStream());
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		byte[] buf = new byte[TILE_SIZE*TILE_SIZE];
		int n = 0;
		while (-1!=(n=in.read(buf)))
		{
			out.write(buf, 0, n);
		}
		out.close();
		in.close();
		byte[] response = out.toByteArray();

		save(response);
	}

	public String getURL() { return _url; }

	public boolean fileExists() {
		File f = new File(_absoluteFilePath);
		return f.exists();
	}
}
