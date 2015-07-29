import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class TileDownloader {

	private static String millisecondsToHumanForm(long ms) {
		long x = ms / 1000;
		long seconds = x % 60;
		x /= 60;
		long minutes = x % 60;
		x /= 60;
		long hours = x % 24;
		x /= 24;
		long days = x;

		return days + " days, " + hours + " hours, " + minutes + " minutes, " + seconds + " seconds";
	}


	public static void main(String[] args) {
		String outputPath = args[0];
		int maxZoom = Integer.parseInt(args[1]);

		String[] maps = {"dark_only_labels","dark_nolabels"};

		System.out.println("Populating requests...");
		List<TileRequest> requestList = new ArrayList<TileRequest>();
		for (String map : maps) {

			// Add the base case
			TileRequest baseRequest = new TileRequest(outputPath,map,0,0,0);
			if (!baseRequest.fileExists()) {
				requestList.add(baseRequest);
			}

			// Make a list of tile requests
			for (int zoom = 1; zoom <= maxZoom; zoom++) {
				long start = System.currentTimeMillis();
				int dim = (2<<(zoom-1));
				for (int x = 0; x < dim; x++) {
					for (int y = 0; y < dim; y++) {
						TileRequest request = new TileRequest(outputPath,map,zoom,x,y);
						if (!request.fileExists()) {
							requestList.add(request);
						}

					}
				}

			}
		}
		System.out.println("done\n");


		int totalTiles = requestList.size();
		int timePerTileApprox = 52;				// takes about 52 ms per tile request
		System.out.println("Fetching " + totalTiles + " tiles...");
		System.out.println("\tETA : approximately " + millisecondsToHumanForm(requestList.size() * timePerTileApprox));
		long totalBytes = 256L*256L*(long)totalTiles;
		System.out.println("\tTotal Data: " + (((totalBytes/1000.0)/1000.0)/1000.0) + "GB" );
		long start = System.currentTimeMillis();
		int failCount = 0;
		int maxFails = 10;
		int i = 1;
		for (TileRequest request : requestList) {
			try {
				request.fetch();
			} catch (IOException e) {
				System.out.println("FAILED: " + request.getURL());
				failCount++;
				if (failCount >= maxFails) {
					System.exit(1);
				}
			}
			if (i%1000 == 0) {
				System.out.println(i + " of " + totalTiles + "complete");
			}
			i++;
		}
		long end = System.currentTimeMillis();
		long duration = end-start;
		System.out.println("done\n");
		System.out.println("Total time: " + millisecondsToHumanForm(duration));
	}
}